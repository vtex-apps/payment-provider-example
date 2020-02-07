import { ForbiddenError } from '@vtex/api'

export class InvalidAppKeyAndAppTokenError extends ForbiddenError {
  constructor() {
    super('Invalid appKey and appToken')
  }
}
