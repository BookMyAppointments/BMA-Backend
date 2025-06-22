import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { prisma } from "../lib/prisma";
import { Request, Response } from "express";
import { isSuperAdmin } from "../middlewares/admin.middleware";
import { generateUniqueId } from "../utils/helpers";

const router = Router();

router.get('/make-admin', authenticateToken, isSuperAdmin, asyncHandler(async (req: Request, res: Response) => {
    try {
        const { email } = req.query;

        const user = await prisma.user.findUnique({
            where: { email: String(email) }
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const uniqueLink = `${process.env.CORS_ORIGIN}/admin/hospital/create?uniqueCode=${generateUniqueId()}`;

        await prisma.$transaction(([
            prisma.user.update({
                where: { id: user.id },
                data: { role: "ADMIN" }
            }),
            prisma.link.create({
                data: {
                    url: uniqueLink,
                    isActive: true
                }
            })
        ]));

        res.status(200).json({ link: uniqueLink, message: "User role updated to ADMIN and link created successfully" });

    } catch (error) {
        console.error("Error in make-admin route:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}));

router.get("/admin-verify-code/:code", asyncHandler(async (req: Request, res: Response) => {
    const { code } = req.params

    const uniqueLink = `${process.env.CORS_ORIGIN}/admin/hospital/create?uniqueCode=${code}`;
    try {
        const link = await prisma.link.findUnique({
            where: {
                url: uniqueLink
            }
        });

        if (!link) return res.status(401).json({ message: "No link found against the code" });

        const validLink = link.isActive;

        if (!validLink) return res.status(403).json({ message: "Link is expired or used before" });

        return res.status(201).json({ message: "Link Verified" })
    }
    catch (err) {
        return res.status(500).json({ message: "Internal Server Error" })
    }
}));

router.get('/requests/:requestId/:action', asyncHandler(authenticateToken), asyncHandler(async (req: Request, res: Response) => {
    const { requestId, action } = req.params;
    const adminId = (req as any).user.id;

    try {

        // const admin = await prisma.user.findUnique({ where: { id: adminId } });
        // if (!admin || admin.role !== 'SUPERADMIN') {
        //   return res.status(403).json({ message: "Unauthorized: Admin access required" });
        // }

        const requests = await prisma.request.findMany();
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

export default router;