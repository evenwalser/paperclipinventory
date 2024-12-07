export interface User {
  id: number;
  username: string;
  email: string;
  profile_image?: string;
  role: 'admin' | 'staff';
}

export interface Item {
  id: string;
  title: string;
  description: string | null;
  price: number;
  category: string;
  subcategory1: string | null;
  subcategory2: string | null;
  condition: string;
  size: string | null;
  status: 'available' | 'low_stock' | 'out_of_stock';
  available_in_store: boolean;
  list_on_paperclip: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ItemImage {
  id: string;
  item_id: string;
  image_url: string;
  display_order: number;
  created_at?: string;
}

export interface Transaction {
  id: number;
  user_id: number;
  total_amount: number;
  transaction_date: string;
  status: 'completed' | 'refunded';
}

export interface TransactionItem {
  id: number;
  transaction_id: number;
  item_id: number;
  quantity: number;
  price: number;
}

export interface Notification {
  id: number;
  user_id: number;
  message: string;
  read: boolean;
  created_at: string;
}

export interface Settings {
  id: number;
  user_id: number;
  store_profile: {
    name?: string;
    description?: string;
    logo?: string;
    contact?: {
      email?: string;
      phone?: string;
      address?: string;
    };
  };
  inventory_settings: {
    low_stock_threshold?: number;
    auto_sync_marketplace?: boolean;
    default_category?: string;
  };
  pos_settings: {
    accepted_payment_methods?: string[];
    receipt_template?: string;
    tax_rate?: number;
  };
  notification_settings: {
    email_notifications?: boolean;
    push_notifications?: boolean;
    low_stock_alerts?: boolean;
  };
  integration_settings: {
    marketplace_enabled?: boolean;
    payment_gateway?: string;
    ai_assistance?: boolean;
  };
}

export interface SalesSummary {
  id: number;
  category: string;
  total_sales: number;
  total_customers: number;
  total_inventory: number;
  sales_velocity: number;
  date_range: string;
} 