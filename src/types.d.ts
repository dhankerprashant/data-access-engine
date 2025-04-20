export interface Customer {
  customerId: string;
  policySchemaVersion: string;
  [key: string]: any;
}

export interface Rule {
  field: string;
  action: string;
  maskType?: string;
  length?: number;
  priority?: number;
  condition?: {
    field: string;
    operator: string;
    value: any;
  };
}