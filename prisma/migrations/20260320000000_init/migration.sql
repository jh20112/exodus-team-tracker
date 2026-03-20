-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyCard" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "goalOfWeek" TEXT,
    "supportRequest" TEXT,
    "generalQuestions" TEXT,
    "mondayCompleted" BOOLEAN NOT NULL DEFAULT false,
    "rose" TEXT,
    "thorn" TEXT,
    "curiousMoment" TEXT,
    "proudOf" TEXT,
    "couldImprove" TEXT,
    "fridayCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_name_key" ON "TeamMember"("name");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyCard_memberId_weekStart_key" ON "WeeklyCard"("memberId", "weekStart");

-- AddForeignKey
ALTER TABLE "WeeklyCard" ADD CONSTRAINT "WeeklyCard_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "TeamMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
