import { z } from 'zod';

const zServiceIdentification = z.object({
  title: z.string(),
  description: z.string(),
  fees: z.string(),
  accessConstraints: z.string(),
});

const zAddress = z.object({
  deliveryPoint: z.string(),
  city: z.string(),
  postalCode: z.string(),
  country: z.string(),
  email: z.string(),
});

const zContact = z.object({
  individualName: z.string(),
  position: z.string(),
  phone: z.string(),
  address: zAddress,
});

const zServiceProvider = z.object({
  name: z.string(),
  site: z.string(),
  contact: zContact,
});

export const zProviderConfig = z.object({
  id: z.string(),
  serviceIdentification: zServiceIdentification,
  serviceProvider: zServiceProvider,
});

export type ProviderConfigSchema = z.infer<typeof zProviderConfig>;
