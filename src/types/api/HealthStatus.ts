export interface HealthStatusResponse {
  success: boolean;
  message: string;
  timestamp: string;
  version: string;
  environment: string;
  services: {
    api: 'healthy' | 'unhealthy' | string;
    database: 'healthy' | 'unhealthy' | string;
  };
  database?: {
    collections: number;
    dataSize: string;
    storageSize: string;
    indexes: number;
    objects: number;
  };
  error?: string;
}
