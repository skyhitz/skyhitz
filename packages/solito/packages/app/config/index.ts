import { ConfigInterface } from './config'
import { ProductionConfig } from './config.production'
import { StagingConfig } from './config.staging'
import { DevelopmentConfig } from './config.development'
import { LocalProdConfig } from './config.local-prod'

/**
 * Environment modes:
 * - 'test': Local API with local test env vars (.dev.vars) + UI in test mode
 * - 'local-prod': Local API with remote production env vars + UI in production mode
 * - 'production': Remote production API + UI in production mode
 * - 'development': Legacy staging mode (kept for backward compatibility)
 */
const ENV = process.env.NEXT_PUBLIC_EXPO_SKYHITZ_ENV

// Default to test mode if not specified
let config: ConfigInterface = DevelopmentConfig

switch (ENV) {
  case 'test':
    config = DevelopmentConfig
    break
  case 'local-prod':
    config = LocalProdConfig
    break
  case 'production':
    config = ProductionConfig
    break
  case 'development':
    config = StagingConfig
    break
}

export const Config = config
