import { authenticateToken } from "../middlewares/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { Router } from "express";
const router = Router();

router.post(
  "/create",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { title, description, time, frequency }: RemainderProp = req.body;
    if (!title || !time || !frequency) {
      return res
        .status(400)
        .json({ message: "Title, time, and frequency are required" });
    }
    const userId = (req as any).user.id;
    try {
      const remainder = await prisma.remainder.create({
        data: {
          title,
          description,
          time: new Date(time),
          frequency,
          userId,
        },
      });
      res.status(201).json(remainder);
    } catch (error) {
      console.error("Error creating remainder:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  })
);

router.get(
  "/get",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const userId = (req as any).user.id;
    try {
      const remainders = await prisma.remainder.findMany({
        where: { userId },
      });
      res.status(200).json(remainders);
    } catch (error) {
      console.error("Error fetching remainders:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  })
);

router.patch(
  "/update/:id",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description, time, frequency }: Partial<RemainderProp> =
      req.body;
    const userId = (req as any).user.id;

    try {
      const updateData: any = {};
      if (title) updateData.title = title;
      if (description) updateData.description = description;
      if (time) {
        const parsedTime = new Date(time);
        if (isNaN(parsedTime.getTime())) {
          return res.status(400).json({ message: "Invalid time format" });
        }
        updateData.time = parsedTime;
      }
      if (frequency) updateData.frequency = frequency;

      if (Object.keys(updateData).length === 0) {
        return res
          .status(400)
          .json({ message: "At least one field is required for update" });
      }

      const remainder = await prisma.remainder.update({
        where: {
          id: id,
          userId: userId,
        },
        data: updateData,
      });

      res.status(200).json(remainder);
    } catch (error) {
      console.error("Error updating remainder:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  })
);

router.delete(
  "/delete/:id",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "id is required" });
    }
    const userId = (req as any).user.id;
    console.log(id, userId);

    try {
      await prisma.remainder.delete({
        where: { id: id, userId },
      });
      res.status(200).send();
    } catch (error) {
      console.error("Error deleting remainder:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  })
);
export default router;
