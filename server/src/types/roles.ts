export enum Role {
  Admin = "admin",
  Editor = "editor",
  Viewer = "viewer",
  ApiConsumer = "api_consumer",
}

export interface UserWithRole {
  id: string;
  email: string;
  role: Role;
  tenantId?: string;
}
