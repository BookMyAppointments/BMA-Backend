import { Frequency } from '@prisma/client';

export interface RemainderProp {   
    title: string;
    description: string;
    time: Date;
    frequency: Frequency; 
}

