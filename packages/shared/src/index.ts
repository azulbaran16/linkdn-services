// Auth
export {
  registerSchema,
  loginSchema,
  type RegisterInput,
  type LoginInput,
} from './schemas/auth';

// Workspace
export {
  workspaceTypeEnum,
  createWorkspaceSchema,
  updateWorkspaceSchema,
  type WorkspaceType,
  type CreateWorkspaceInput,
  type UpdateWorkspaceInput,
} from './schemas/workspace';

// Profile
export {
  upsertProfileSchema,
  type UpsertProfileInput,
} from './schemas/profile';

// Service
export {
  createServiceSchema,
  updateServiceSchema,
  type CreateServiceInput,
  type UpdateServiceInput,
} from './schemas/service';

// Availability
export {
  availabilityRuleSchema,
  upsertAvailabilitySchema,
  type AvailabilityRuleInput,
  type UpsertAvailabilityInput,
} from './schemas/availability';

// Booking
export {
  createBookingSchema,
  rescheduleBookingSchema,
  bookingStatusEnum,
  type CreateBookingInput,
  type RescheduleBookingInput,
  type BookingStatus,
} from './schemas/booking';

// Marketplace
export {
  marketplaceSearchSchema,
  type MarketplaceSearchInput,
} from './schemas/marketplace';
