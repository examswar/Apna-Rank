import { prisma } from '@apna-rank/db';
import { NotFoundError, ForbiddenError } from '../../lib/errors';

// Full select used only by platform_admin (create/update paths).
const Q_FULL_SELECT = {
  id: true,
  examCategory: true,
  subject: true,
  topic: true,
  subTopic: true,
  language: true,
  difficultyTag: true,
  irtDifficulty: true,
  questionText: true,
  options: true,
  correctOption: true,
  explanation: true,
  attemptCount: true,
  isActive: true,
  createdAt: true,
  creator: { select: { id: true, name: true } },
} as const;

// Public select: correctOption and explanation are withheld from students.
const Q_PUBLIC_SELECT = {
  id: true,
  examCategory: true,
  subject: true,
  topic: true,
  subTopic: true,
  language: true,
  difficultyTag: true,
  irtDifficulty: true,
  questionText: true,
  options: true,
  attemptCount: true,
  isActive: true,
  createdAt: true,
  creator: { select: { id: true, name: true } },
} as const;

export async function createQuestion(
  userId: string,
  data: {
    examCategory: string;
    subject?: string;
    topic?: string;
    subTopic?: string;
    language?: string;
    questionText: string;
    options: unknown;
    correctOption: string;
    explanation?: string;
    difficultyTag: string;
  },
) {
  return prisma.question.create({
    data: {
      examCategory: data.examCategory as any,
      subject: data.subject,
      topic: data.topic,
      subTopic: data.subTopic,
      language: (data.language ?? 'hi') as any,
      questionText: data.questionText,
      options: data.options as any,
      correctOption: data.correctOption,
      explanation: data.explanation,
      difficultyTag: data.difficultyTag as any,
      createdBy: userId,
      isActive: true,
    },
    select: Q_FULL_SELECT,
  });
}

export async function listQuestions(
  filters: {
    examCategory?: string;
    difficulty?: string;
    subject?: string;
    topic?: string;
  },
  page: number,
  limit: number,
) {
  const skip = (page - 1) * limit;
  const where: Record<string, unknown> = { isActive: true };
  if (filters.examCategory) where.examCategory = filters.examCategory;
  if (filters.difficulty) where.difficultyTag = filters.difficulty;
  if (filters.subject) where.subject = { contains: filters.subject, mode: 'insensitive' };
  if (filters.topic) where.topic = { contains: filters.topic, mode: 'insensitive' };

  const [questions, total] = await Promise.all([
    prisma.question.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        examCategory: true,
        subject: true,
        topic: true,
        difficultyTag: true,
        questionText: true,
        options: true,
        attemptCount: true,
        createdAt: true,
        creator: { select: { id: true, name: true } },
      },
    }),
    prisma.question.count({ where }),
  ]);

  return { questions, total };
}

export async function getQuestion(id: string, includeAnswer = false) {
  const q = await prisma.question.findUnique({
    where: { id, isActive: true },
    select: includeAnswer ? Q_FULL_SELECT : Q_PUBLIC_SELECT,
  });
  if (!q) throw new NotFoundError('Question');
  return q;
}

export async function updateQuestion(
  id: string,
  userId: string,
  role: string,
  data: {
    questionText?: string;
    options?: unknown;
    correctOption?: string;
    explanation?: string;
    difficultyTag?: string;
    subject?: string;
    topic?: string;
    isActive?: boolean;
  },
) {
  const q = await prisma.question.findUnique({ where: { id } });
  if (!q) throw new NotFoundError('Question');
  if (q.createdBy !== userId && role !== 'platform_admin') throw new ForbiddenError();

  return prisma.question.update({
    where: { id },
    data: {
      ...(data.questionText !== undefined && { questionText: data.questionText }),
      ...(data.options !== undefined && { options: data.options as any }),
      ...(data.correctOption !== undefined && { correctOption: data.correctOption }),
      ...(data.explanation !== undefined && { explanation: data.explanation }),
      ...(data.difficultyTag !== undefined && { difficultyTag: data.difficultyTag as any }),
      ...(data.subject !== undefined && { subject: data.subject }),
      ...(data.topic !== undefined && { topic: data.topic }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
    select: Q_FULL_SELECT,
  });
}
