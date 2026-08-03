export type ThemePreference = "light" | "dark" | "system";
export type WorkspaceRole = "owner";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          first_name: string | null;
          last_name: string | null;
          business_name: string | null;
          avatar_path: string | null;
          theme_preference: ThemePreference;
          accepted_terms: true | null;
          completed_onboarding: string | null;
          onboarding_completed: boolean;
          onboarding_completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          business_name?: string | null;
          avatar_path?: string | null;
          theme_preference?: ThemePreference;
          accepted_terms?: true | null;
          completed_onboarding?: string | null;
          onboarding_completed?: boolean;
          onboarding_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          business_name?: string | null;
          avatar_path?: string | null;
          theme_preference?: ThemePreference;
          accepted_terms?: true | null;
          completed_onboarding?: string | null;
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
          primary_category: string | null;
          selling_markets: string[] | null;
          experience_level: string | null;
          selling_channels: string[] | null;
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
          primary_category?: string | null;
          selling_markets?: string[] | null;
          experience_level?: string | null;
          selling_channels?: string[] | null;
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
          primary_category?: string | null;
          selling_markets?: string[] | null;
          experience_level?: string | null;
          selling_channels?: string[] | null;
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
          p_first_name: string;
          p_last_name: string;
          p_business_name?: string | null;
          p_business_type: string;
          p_primary_category: string;
          p_country_code: string;
          p_default_currency: string;
          p_selling_markets: string[];
          p_experience_level: string;
          p_selling_channels: string[];
          p_accepted_terms: true;
          p_locale: string;
          p_time_zone: string;
        };
        Returns: string;
      };
      update_business_settings: {
        Args: {
          p_workspace_name: string;
          p_business_name: string | null;
          p_business_type: string;
          p_country_code: string;
        };
        Returns: undefined;
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
