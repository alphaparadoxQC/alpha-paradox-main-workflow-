/**
 * ============================================================
 * BRANDING CONFIGURATION
 * ============================================================
 * White-label branding configuration for the quantum computing platform.
 * Users can customize these values to personalize their deployment.
 * ============================================================
 */

export interface BrandingConfig {
  // Platform name
  platformName: string;
  platformShortName: string;
  platformTagline: string;
  
  // Hardware/Cloud service name
  hardwareServiceName: string;
  hardwareServiceShortName: string;
  
  // URLs and links
  docsUrl?: string;
  supportEmail?: string;
  
  // Feature flags
  showPoweredBy: boolean;
}

/**
 * Default branding configuration
 * Replace these values to white-label the platform
 */
export const BRANDING: BrandingConfig = {
  platformName: 'Alpha ParadoxQC',
  platformShortName: 'APQC',
  platformTagline: 'Quantum Computing in Your Browser',
  
  hardwareServiceName: 'Quantum Cloud',
  hardwareServiceShortName: 'QC',
  
  docsUrl: '',
  supportEmail: '',
  
  showPoweredBy: false,
};

/**
 * Get hardware service display name
 */
export const getHardwareServiceName = () => BRANDING.hardwareServiceName;

/**
 * Get platform display name  
 */
export const getPlatformName = () => BRANDING.platformName;
