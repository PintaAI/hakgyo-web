import { generateObject, zodSchema } from 'ai';
import { google } from '@ai-sdk/google';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Define schemas for different generation types
const vocabularyItemSchema = z.object({
  korean: z.string().min(1),
  indonesian: z.string().min(1),
  type: z.enum(['WORD', 'SENTENCE', 'IDIOM']),
  korean_example_sentence: z.string().min(1),
  indonesian_example_sentence: z.string().min(1)
});

const vocabularyItemsSchema = z.array(vocabularyItemSchema).min(1).max(10);

const soalItemSchema = z.object({
  pertanyaan: z.string().min(1),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  explanation: z.string().optional(),
  opsis: z.array(z.object({
    opsiText: z.string().min(1),
    isCorrect: z.boolean()
  })).min(3).max(5)
});

const soalItemsSchema = z.array(soalItemSchema).min(1).max(1);

export async function POST(request: Request) {
  const { prompt, existingItems, type = 'vocabulary' } = await request.json();
  // console.log('[ai/generate] request body received', {
  //   hasPrompt: !!prompt,
  //   type,
  //   existingItemsCount: Array.isArray(existingItems) ? existingItems.length : 0,
  // });

  if (!prompt) {
    return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
  }

  let modifiedPrompt = prompt;

  // Choose schema based on generation type
  if (type === 'soal' || type === 'question') {
    if (existingItems && existingItems.length > 0) {
      const existingQuestions = existingItems.map((item: any) => item.pertanyaan).join(', ');
      modifiedPrompt += ` **Please ensure the new questions are different from the following existing questions: ${existingQuestions}.**`;
    }
  } else {
    // Default to vocabulary
    if (existingItems && existingItems.length > 0) {
      const existingKoreanWords = existingItems.map((item: any) => item.korean).join(', ');
      modifiedPrompt += ` **Please ensure the new words are not in the following list of existing words: ${existingKoreanWords}.**`;
    }
  }

  // console.log('[ai/generate] modifiedPrompt preview:', modifiedPrompt.slice(0, 500));

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return NextResponse.json({ error: 'GOOGLE_GENERATIVE_AI_API_KEY not set' }, { status: 500 });
  }

  try {
    // console.log('[ai/generate] initializing model (key present)');
    
    // Use the zodSchema helper to convert our Zod schema to AI SDK compatible format
    let sdkSchema;
    if (type === 'soal' || type === 'question') {
      sdkSchema = zodSchema(soalItemsSchema);
    } else {
      sdkSchema = zodSchema(vocabularyItemsSchema);
    }
    // console.log('[ai/generate] calling generateObject with zodSchema for type:', type);
    
    const { object } = await generateObject({
      model: google('gemini-2.5-flash-lite'),
      schema: sdkSchema,
      prompt: modifiedPrompt,
    });
    
    // console.log('[ai/generate] generation result received', {
    //   objectType: typeof object,
    //   itemCount: Array.isArray(object) ? object.length : undefined
    // });
    
    return NextResponse.json(object);
  } catch (error) {
    console.error('AI Generation Error:', error);
    return NextResponse.json({ error: (error as Error).message || 'Generation failed' }, { status: 500 });
  }
}
