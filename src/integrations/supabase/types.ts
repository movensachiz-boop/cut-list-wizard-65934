export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      blocked_ips: {
        Row: {
          blocked_by: string | null
          created_at: string | null
          id: string
          ip_address: string
          reason: string | null
        }
        Insert: {
          blocked_by?: string | null
          created_at?: string | null
          id?: string
          ip_address: string
          reason?: string | null
        }
        Update: {
          blocked_by?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string
          reason?: string | null
        }
        Relationships: []
      }
      cutting_items: {
        Row: {
          confidence: string | null
          created_at: string | null
          cutting_list_id: string
          edging_material: string
          edging_type: string
          id: string
          length: number
          material: string
          notes: string | null
          quantity: number
          width: number
        }
        Insert: {
          confidence?: string | null
          created_at?: string | null
          cutting_list_id: string
          edging_material: string
          edging_type: string
          id?: string
          length: number
          material: string
          notes?: string | null
          quantity: number
          width: number
        }
        Update: {
          confidence?: string | null
          created_at?: string | null
          cutting_list_id?: string
          edging_material?: string
          edging_type?: string
          id?: string
          length?: number
          material?: string
          notes?: string | null
          quantity?: number
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "cutting_items_cutting_list_id_fkey"
            columns: ["cutting_list_id"]
            isOneToOne: false
            referencedRelation: "cutting_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      cutting_lists: {
        Row: {
          created_at: string | null
          id: string
          name: string
          notes: string | null
          total_items: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          notes?: string | null
          total_items?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          total_items?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      hardware_entries: {
        Row: {
          created_at: string | null
          custom_name: string | null
          cutting_list_id: string
          hardware_item_id: string | null
          id: string
          notes: string | null
          quantity: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          custom_name?: string | null
          cutting_list_id: string
          hardware_item_id?: string | null
          id?: string
          notes?: string | null
          quantity?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          custom_name?: string | null
          cutting_list_id?: string
          hardware_item_id?: string | null
          id?: string
          notes?: string | null
          quantity?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hardware_entries_cutting_list_id_fkey"
            columns: ["cutting_list_id"]
            isOneToOne: false
            referencedRelation: "cutting_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hardware_entries_hardware_item_id_fkey"
            columns: ["hardware_item_id"]
            isOneToOne: false
            referencedRelation: "hardware_items"
            referencedColumns: ["id"]
          },
        ]
      }
      hardware_items: {
        Row: {
          cost: number | null
          created_at: string | null
          id: string
          import_code: string | null
          name: string
          price: number | null
          short_name: string | null
          supplier_website: string | null
          updated_at: string | null
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          id?: string
          import_code?: string | null
          name: string
          price?: number | null
          short_name?: string | null
          supplier_website?: string | null
          updated_at?: string | null
        }
        Update: {
          cost?: number | null
          created_at?: string | null
          id?: string
          import_code?: string | null
          name?: string
          price?: number | null
          short_name?: string | null
          supplier_website?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ip_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string
          license_key: string | null
          user_agent: string | null
        }
        Insert: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address: string
          license_key?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: string
          license_key?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      licenses: {
        Row: {
          api_key: string
          assigned_user_id: string | null
          company_name: string
          created_at: string | null
          expiry_date: string
          id: string
          license_key: string
          notes: string | null
          status: Database["public"]["Enums"]["license_status"]
          suspended_at: string | null
          suspended_reason: string | null
        }
        Insert: {
          api_key: string
          assigned_user_id?: string | null
          company_name: string
          created_at?: string | null
          expiry_date: string
          id?: string
          license_key: string
          notes?: string | null
          status?: Database["public"]["Enums"]["license_status"]
          suspended_at?: string | null
          suspended_reason?: string | null
        }
        Update: {
          api_key?: string
          assigned_user_id?: string | null
          company_name?: string
          created_at?: string | null
          expiry_date?: string
          id?: string
          license_key?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["license_status"]
          suspended_at?: string | null
          suspended_reason?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      project_approvals: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          project_id: string
          requested_by: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          project_id: string
          requested_by: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          project_id?: string
          requested_by?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_approvals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          project_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          project_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          project_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string | null
          created_by: string
          cutting_list: Json
          description: string | null
          id: string
          name: string
          optimization_result: Json | null
          status: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          cutting_list: Json
          description?: string | null
          id?: string
          name: string
          optimization_result?: Json | null
          status?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          cutting_list?: Json
          description?: string | null
          id?: string
          name?: string
          optimization_result?: Json | null
          status?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      uploaded_images: {
        Row: {
          analysis_result: Json | null
          created_at: string | null
          cutting_list_id: string | null
          file_name: string
          file_path: string
          id: string
          items_extracted: number | null
          user_id: string
        }
        Insert: {
          analysis_result?: Json | null
          created_at?: string | null
          cutting_list_id?: string | null
          file_name: string
          file_path: string
          id?: string
          items_extracted?: number | null
          user_id: string
        }
        Update: {
          analysis_result?: Json | null
          created_at?: string | null
          cutting_list_id?: string | null
          file_name?: string
          file_path?: string
          id?: string
          items_extracted?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "uploaded_images_cutting_list_id_fkey"
            columns: ["cutting_list_id"]
            isOneToOne: false
            referencedRelation: "cutting_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workspace_members: {
        Row: {
          created_at: string | null
          id: string
          invited_by: string | null
          role: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          invited_by?: string | null
          role: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          invited_by?: string | null
          role?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          owner_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          owner_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_api_key: { Args: never; Returns: string }
      generate_license_key: { Args: never; Returns: string }
      get_user_count: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      license_status: "active" | "suspended" | "expired" | "trial"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      license_status: ["active", "suspended", "expired", "trial"],
    },
  },
} as const
