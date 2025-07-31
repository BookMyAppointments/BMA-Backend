interface RemainderProp {   
    title: string;
    description: string;
    time: Date;
    frequency: Frequency; 
}
enum Frequency {
    DAILY = "DAILY",
    WEEKLY = "WEEKLY",
    MONTHLY = "MONTHLY",
    YEARLY = "YEARLY"
}

