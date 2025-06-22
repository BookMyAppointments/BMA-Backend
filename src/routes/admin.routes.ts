import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { prisma } from "../lib/prisma";
import { Request, Response } from "express";

const router = Router();

router.get('/requests/:requestId/:action', asyncHandler(authenticateToken), asyncHandler(async (req: Request, res: Response) => {
    const { requestId, action } = req.params;
    const adminId = (req as any).user.id;

    try {

        // const admin = await prisma.user.findUnique({ where: { id: adminId } });
        // if (!admin || admin.role !== 'SUPERADMIN') {
        //   return res.status(403).json({ message: "Unauthorized: Admin access required" });
        // }

        const requests = await prisma.request.findMany()
        console.log(requests);


        // if (!request) {
        //   return res.status(404).json({ message: "Request not found" });
        // }

        // const frontendUrl = process.env.FRONTEND_URL;
        // if (!frontendUrl) {
        //   return res.status(500).json({ message: "FRONTEND_URL is not configured in environment" });
        // }

        // if (action === 'approve') {
        //   try {
        //     const [link] = await prisma.$transaction(async (tx) => {
        //       const createdLink = await tx.link.create({
        //         data: {
        //           url: `${frontendUrl}/admin/hospital/create/32`, // You may want to replace hardcoded `32`
        //           isActive: true
        //         }
        //       });

        //       await tx.request.update({
        //         where: { id: requestId },
        //         data: { status: "ACTIVE" }
        //       });

        //       await tx.user.update({
        //         where: { id: request.user.id },
        //         data: { role: "ADMIN" }
        //       });

        //       return [createdLink];
        //     });

        //     await sendHospitalCreationMail({
        //       email: request.user.email,
        //       linkId: link.id,
        //       frontendUrl
        //     });

        //     return res.status(200).json({
        //       message: "Request approved and email sent",
        //       linkId: link.id
        //     });

        //   } catch (txnError) {
        //     console.error("Transaction error (approve):", txnError);
        //     return res.status(500).json({ message: "Failed to approve request. No changes made." });
        //   }
        // }

        // else if (action === 'reject') {
        //   try {
        //     await prisma.request.update({
        //       where: { id: requestId },
        //       data: { status: 'INACTIVE' }
        //     });


        return res.status(200).json({
            message: "Request rejected successfully"
        });

        //   } catch (rejError) {
        //     console.error("Rejection error:", rejError);
        //     return res.status(500).json({ message: "Failed to reject request" });
        //   }
        // }

        // return res.status(400).json({ message: "Invalid action" });

    } catch (error) {
        console.error("Request handler error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}));

router.get("/admin-verify-code/:code", asyncHandler(async (req: Request, res: Response) => {
    const { code } = req.params

    try {
        const link = await prisma.link.findUnique({
            where: {
                id: code
            }
        })
        if (!link) return res.status(401).json({ message: "No link found against the code" })
        const validLink = link.isActive
        if (!validLink) return res.status(403).json({ message: "Link is expired or used before" })
        return res.status(201).json({ message: "Link Verified" })
    }
    catch (err) {
        return res.status(500).json({ message: "Internal Server Error" })
    }
}));

router.post("/admin-request-create", authenticateToken, asyncHandler(async (req: Request, res: Response) => {
    const id = (req as any).user.id;
    const { hospitalId } = req.body
    try {
        const user = await prisma.user.findUnique({
            where: { id }
        });

        if (!user) return res.status(404).json({ message: "User not found" });

        const superadmin = await prisma.user.findFirst({
            where: { role: "SUPERADMIN" }
        });

        if (!superadmin) return res.status(404).json({ message: "Super Admin not found" });

        const createdRequest = await prisma.request.create({
            data: {
                userEmail: user.email,
                user: {
                    connect: {
                        id: superadmin.id
                    }
                },
                hospital: {
                    connect: {
                        id: hospitalId
                    }
                },
                expiryTime: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000))
            }
        });

        return res.status(201).json({ message: "Request Succesfully Created", request: createdRequest })
    }
    catch (err) {
        console.error("Error in creating admin request:", err);
        return res.status(500).json({ message: "Internal Server Error" })
    }
}));

router.get("/admin-route", authenticateToken, asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        await prisma.user.update({
            where: { id: userId },
            data: {
                role: "ADMIN"
            }
        });

        res.status(200).json({ "Message": "Admin role updated for user!" })
    } catch (error) {
        console.error("Error in catch block", error);
        res.status(500).json({ "message": "Internal Server Error!" });
    }
}));

// app.get('/make-superadmin', asyncHandler(async (req, res) => {
//     try {
//         const { email } = req.query;

//         const user = await prisma.user.findFirst({
//             where: { email: String(email) },
//             select: {
//                 id: true,
//                 email: true,
//                 role: true,
//             },
//         });

//         console.log('Making user superadmin:', user);

//         if (!user) {
//             return res.status(404).json({ error: 'User not found' });
//         }

//         const updatedUser = await prisma.user.update({
//             where: { email: String(email) },
//             data: { role: 'SUPERADMIN' },
//         });

//         res.status(200).json({ message: 'User made superadmin successfully', user: updatedUser });

//     } catch (error) {
//         console.error('Error making superadmin:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }));

export default router;