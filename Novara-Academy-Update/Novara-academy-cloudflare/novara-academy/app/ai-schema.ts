import {z} from 'zod';
const short=z.string().max(2500);
export const aiReportSchema=z.object({summary:short,strengths:z.array(short).max(8),gaps:z.array(short).max(8),recommendations:z.array(z.object({id:z.string(),category:z.enum(['High reach','Reach','Potential match','Insufficient evidence']),explanation:short,academicAssessment:short,financialAssessment:short,requirements:z.array(z.object({claim:short,source:z.string().url()})).max(8),uncertainties:z.array(short).max(8)})).min(3).max(10),roadmap:z.array(z.object({title:z.string().max(200),action:short,timing:z.string().max(250)})).min(3).max(8)});
export type AIReport=z.infer<typeof aiReportSchema> & {generatedAt:string;model:string;sources:{url:string;title:string}[]};
