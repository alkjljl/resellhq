export type ThemePreference = "light" | "dark" | "system";
export type WorkspaceRole = "owner";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_path: string | null;
          theme_preference: ThemePreference;
          onboarding_completed: boolean;
          onboarding_completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_path?: string | null;
          theme_preference?: ThemePreference;
          onboarding_completed?: boolean;
          onboarding_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string | null;
          avatar_path?: string | null;
          theme_preference?: ThemePreference;
          onboarding_completed?: boolean;
          onboarding_completed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      workspaces: {
        Row: {
          id: string;
          name: string;
          business_type: string | null;
          country_code: string;
          default_currency: string;
          locale: string;
          time_zone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          business_type?: string | null;
          country_code: string;
          default_currency: string;
          locale: string;
          time_zone: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          business_type?: string | null;
          country_code?: string;
          default_currency?: string;
          locale?: string;
          time_zone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workspace_memberships: {
        Row: {
          workspace_id: string;
          user_id: string;
          role: WorkspaceRole;
          created_at: string;
        };
        Insert: {
          workspace_id: string;
          user_id: string;
          role?: WorkspaceRole;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      complete_onboarding: {
        Args: {
          p_display_name: string;
          p_workspace_name: string;
          p_business_type: string | null;
          p_country_code: string;
          p_default_currency: string;
          p_locale: string;
          p_time_zone: string;
        };
        Returns: string;
      };
      update_preferences: {
        Args: {
          p_default_currency: string;
          p_locale: string;
          p_time_zone: string;
          p_theme_preference: ThemePreference;
        };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
