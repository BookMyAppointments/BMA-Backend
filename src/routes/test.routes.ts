import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { isLab } from '../middlewares/lab.middleware';

const router = Router();

//* -------------------------  MEDICAL TEST CRUD OPERATIONS ------------------------- *// 

//* Create a new medical test (Admin/Lab)
router.post('/create', authenticateToken, isLab, asyncHandler(async (req: Request, res: Response) => {
    try {
        const { name, category, price, homeSample, labId } = req.body;

        // Validate input
        if (!name || !category || price === undefined || homeSample === undefined) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Check if lab exists
        const lab = await prisma.lab.findUnique({
            where: { id: labId }
        });

        if (!lab) {
            return res.status(404).json({ message: "Lab not found" });
        }

        // Create the test
        const test = await prisma.medicalTest.create({
            data: {
                name,
                category,
                price,
                homeSample,
                labId
            },
            include: {
                lab: true
            }
        });

        res.status(201).json({
            message: "Medical test created successfully",
            test
        });
    } catch (error) {
        console.error('Error creating medical test:', error);
        res.status(500).json({ message: "An error occurred while creating the medical test" });
    }
}));

//* Get all medical tests
router.get('/get', asyncHandler(async (req: Request, res: Response) => {
    try {
        const { category, minPrice, maxPrice, homeSample } = req.query;

        const where: any = {};

        if (category) {
            where.category = category as string;
        }

        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice) where.price.gte = parseFloat(minPrice as string);
            if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
        }

        if (homeSample) {
            where.homeSample = homeSample === 'true';
        }

        const tests = await prisma.medicalTest.findMany({
            where,
            include: {
                lab: {
                    include: {
                        hospital: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });

        res.status(200).json(tests);
    } catch (error) {
        console.error('Error fetching medical tests:', error);
        res.status(500).json({ message: "An error occurred while fetching medical tests" });
    }
}));

//* Get test by ID (for all user)
router.get('/get/:id', asyncHandler(async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const test = await prisma.medicalTest.findUnique({
            where: { id },
            include: {
                lab: {
                    include: {
                        hospital: true
                    }
                }
            }
        });

        if (!test) {
            return res.status(404).json({ message: "Medical test not found" });
        }

        res.status(200).json(test);
    } catch (error) {
        console.error('Error fetching medical test:', error);
        res.status(500).json({ message: "An error occurred while fetching the medical test" });
    }
}));

//* Update medical test (Admin/Lab)
router.put('/update/:id', authenticateToken, isLab, asyncHandler(async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, category, price, homeSample } = req.body;

        const test = await prisma.medicalTest.findUnique({
            where: { id }
        });

        if (!test) {
            return res.status(404).json({ message: "Medical test not found" });
        }

        const updatedTest = await prisma.medicalTest.update({
            where: { id },
            data: {
                name: name || test.name,
                category: category || test.category,
                price: price !== undefined ? price : test.price,
                homeSample: homeSample !== undefined ? homeSample : test.homeSample
            },
            include: {
                lab: true
            }
        });

        res.status(200).json({
            message: "Medical test updated successfully",
            test: updatedTest
        });
    } catch (error) {
        console.error('Error updating medical test:', error);
        res.status(500).json({ message: "An error occurred while updating the medical test" });
    }
}));

//* Delete medical test (Admin/Lab)
router.delete('/delete/:id', authenticateToken, isLab, asyncHandler(async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const test = await prisma.medicalTest.findUnique({
            where: { id }
        });

        if (!test) {
            return res.status(404).json({ message: "Medical test not found" });
        }

        await prisma.medicalTest.delete({
            where: { id }
        });

        res.status(200).json({ message: "Medical test deleted successfully" });
    } catch (error) {
        console.error('Error deleting medical test:', error);
        res.status(500).json({ message: "An error occurred while deleting the medical test" });
    }
}));

//* ------------------------- TEST CATEGORIES & RESULTS ------------------------- *//

//* Get all test categories (for all user)
router.get('/categories/all', asyncHandler(async (req: Request, res: Response) => {
    try {
        const categories = await prisma.medicalTest.groupBy({
            by: ['category'],
            _count: {
                category: true
            },
            orderBy: {
                category: 'asc'
            }
        });

        res.status(200).json(categories);
    } catch (error) {
        console.error('Error fetching test categories:', error);
        res.status(500).json({ message: "An error occurred while fetching test categories" });
    }
}));

//* Upload test results (Lab)
router.post('/results/:id', authenticateToken, isLab, asyncHandler(async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { userId, result } = req.body;

        const test = await prisma.medicalTest.findUnique({
            where: { id }
        });

        if (!test) {
            return res.status(404).json({ message: "Medical test not found" });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const testResult = await prisma.testResult.create({
            data: {
                userId,
                testId: id,
                result,
                issuedAt: new Date()
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                test: true
            }
        });

        res.status(201).json({
            message: "Test result uploaded successfully",
            result: testResult
        });
    } catch (error) {
        console.error('Error uploading test result:', error);
        res.status(500).json({ message: "An error occurred while uploading the test result" });
    }
}));

//* Get test results for user
router.get('/results/get', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;

        const results = await prisma.testResult.findMany({
            where: { userId },
            include: {
                test: {
                    include: {
                        lab: true
                    }
                }
            },
            orderBy: {
                issuedAt: 'desc'
            }
        });

        res.status(200).json(results);
    } catch (error) {
        console.error('Error fetching test results:', error);
        res.status(500).json({ message: "An error occurred while fetching test results" });
    }
}));

//* Get test results for a specific test (Lab)
router.get('/results/:id', authenticateToken, isLab, asyncHandler(async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const test = await prisma.medicalTest.findUnique({
            where: { id }
        });

        if (!test) {
            return res.status(404).json({ message: "Medical test not found" });
        }

        const results = await prisma.testResult.findMany({
            where: { testId: id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                issuedAt: 'desc'
            }
        });

        res.status(200).json(results);
    } catch (error) {
        console.error('Error fetching test results:', error);
        res.status(500).json({ message: "An error occurred while fetching test results" });
    }
})); 

//* Get tests by lab (for all user)
router.get('/lab/:labId', asyncHandler(async (req: Request, res: Response) => {
    try {
        const { labId } = req.params;

        const lab = await prisma.lab.findUnique({
            where: { id: labId }
        });

        if (!lab) {
            return res.status(404).json({ message: "Lab not found" });
        }

        const tests = await prisma.medicalTest.findMany({
            where: { labId },
            orderBy: {
                name: 'asc'
            }
        });

        res.status(200).json(tests);
    } catch (error) {
        console.error('Error fetching lab tests:', error);
        res.status(500).json({ message: "An error occurred while fetching lab tests" });
    }
}));

export default router;