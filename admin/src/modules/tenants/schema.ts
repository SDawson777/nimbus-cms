import {z} from 'zod'
export const Tenant = z.object({id:z.string(), name:z.string(), slug:z.string()})
export type Tenant = z.infer<typeof Tenant>
