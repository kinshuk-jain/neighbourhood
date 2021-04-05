export const config: { [key: string]: any } = {
  staging: {
    comms_domain: 'http://localhost:3000',
    user_domain: 'http://localhost:3000',
    my_domain: 'http://localhost:3000',
  },
  development: {
    comms_domain: 'http://localhost:3000',
    user_domain: 'http://localhost:3000',
    my_domain: 'http://localhost:3000',
  },
  production: {
    comms_domain: 'http://localhost:3000',
    user_domain: 'http://localhost:3000',
    my_domain: 'http://localhost:3000',
  },
}

export const ENV = process.env.ENVIRONMENT || 'development'
