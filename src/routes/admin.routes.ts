import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { prisma } from "../lib/prisma";
import { Request, Response } from "express";
import { isAdmin, isSuperAdmin } from "../middlewares/admin.middleware";
import { generateUniqueId } from "../utils/helpers";
import { AppointmentStatus } from "@prisma/client";

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

        // const uniqueLink = `${process.env.CORS_ORIGIN}/admin/hospital/create?uniqueCode=${generateUniqueId()}`;
        const uniqueCode = generateUniqueId();

        await prisma.$transaction(([
            prisma.user.update({
                where: { id: user.id },
                data: { role: "ADMIN" }
            }),
            prisma.link.create({
                data: {
                    url: uniqueCode,
                    isActive: true
                }
            })
        ]));

        res.status(200).json({ code: uniqueCode, message: "User role updated to ADMIN and link created successfully" });

    } catch (error) {
        console.error("Error in make-admin route:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}));

router.get("/admin-verify-code/:code", asyncHandler(async (req: Request, res: Response) => {
    const { code } = req.params;

    // const uniqueLink = `${process.env.CORS_ORIGIN}/admin/hospital/create?uniqueCode=${code}`;
    try {
        const link = await prisma.link.findUnique({
            where: {
                url: code
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

router.get('/get-all-requests', authenticateToken, isSuperAdmin, asyncHandler(async (req: Request, res: Response) => {
    try {
        const adminRequests = await prisma.request.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                createdAt: true,
                id: true,
                userEmail: true,
                expiryTime: true,
                status: true,
                hospital: {
                    select: {
                        id: true,
                        name: true,
                        services: true,
                        departments: true,
                        facilities: true,
                        location: {
                            select: {
                                lat: true,
                                lng: true,
                                address: true,
                            }
                        },
                    }
                },
                lab: {
                    select: {
                        id: true,
                        name: true,
                        services: true,
                        hospital: { select: { id: true, name: true } },
                        location: {
                            select: {
                                lat: true,
                                lng: true,
                                address: true,
                            }
                        },
                    }
                },
            },
        });

        res.status(200).json(adminRequests);

    } catch (error) {
        console.error("Error fetching admin requests:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}));

router.put('/update-status', authenticateToken, isSuperAdmin, asyncHandler(async (req: Request, res: Response) => {
    try {
        const { requestId, status } = req.body;

        if (!requestId || !status) {
            return res.status(400).json({ message: "Request ID and status are required" });
        }

        const updatedRequest = await prisma.request.update({
            where: { id: requestId },
            data: { status },
            include: { user: true, hospital: true, lab: true }
        });

        if (status === "ACTIVE" && updatedRequest.userId && updatedRequest.hospitalId) {
            await prisma.$transaction([
                prisma.user.update({
                    where: { id: updatedRequest.userId },
                    data: { role: "ADMIN" }
                }),
                prisma.hospital.update({
                    where: { id: updatedRequest.hospitalId },
                    data: { adminId: updatedRequest.userId, status: 'ACTIVE' }
                })
            ]);
        } else if (status === "ACTIVE" && updatedRequest.userId && updatedRequest.labId) {
            await prisma.$transaction([
                prisma.user.update({
                    where: { id: updatedRequest.userId },
                    data: { role: "ADMIN" }
                }),
                prisma.lab.update({
                    where: { id: updatedRequest.labId },
                    data: { adminId: updatedRequest.userId, status: 'ACTIVE' }
                })
            ]);
        }

        res.status(200).json(updatedRequest);

    } catch (error) {
        console.error("Error updating request status:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}));

router.get('/:appointmentId/:action', authenticateToken, isAdmin, asyncHandler(async (req: Request, res: Response) => {
    const { appointmentId, action } = req.params;


    const statusMap: Record<string, AppointmentStatus> = {
        confirm: "CONFIRMED",
        complete: "COMPLETED",
        cancel: "CANCELLED",
        reschedule: "RESCHEDULED"
    };

    const newStatus = statusMap[action.toLowerCase()];
    if (!newStatus) {
        return res.status(400).json({ message: "Invalid action" });
    }

    // Update appointment status
    const updated = await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: newStatus }
    });

    res.status(200).json({ message: `Appointment marked as ${newStatus}`, appointment: updated });
}));

router.get('/get-banner-images', asyncHandler(async (req: Request, res: Response) => {
    try {
        const bannerImages = await prisma.bannerImages.findMany();
        res.status(200).json(bannerImages);
    } catch (error) {
        console.error("Error fetching banner images:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}));

router.put('/update-banner-images', authenticateToken, isSuperAdmin, asyncHandler(async (req: Request, res: Response) => {
    try {
        const bannerUpdates = req.body;

        if (!Array.isArray(bannerUpdates)) {
            return res.status(400).json({ message: "Request body must be an array" });
        }

        const updates = await Promise.all(
            bannerUpdates.map(banner => 
                prisma.bannerImages.update({
                    where: { id: banner.id },
                    data: { isActive: banner.isActive }
                })
            )
        );

        res.status(200).json({ message: "Banner images updated successfully", updates });
    } catch (error) {
        console.error("Error updating banner images:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}));

//* The requester's own hospital/lab registrations, so they can check status
//* without a super admin telling them anything -- any signed-in user, no
//* special role needed, scoped to their own requests only.
router.get('/my-requests', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;

        const requests = await prisma.request.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                status: true,
                createdAt: true,
                hospital: { select: { id: true, name: true } },
                lab: { select: { id: true, name: true } },
            },
        });

        res.status(200).json(requests);
    } catch (error) {
        console.error("Error fetching own requests:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}));

export default router;