export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount?: number;
  sortOrder?: number;
}
