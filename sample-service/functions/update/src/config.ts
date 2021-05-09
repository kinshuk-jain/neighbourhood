export const config: { [key: string]: any } = {
  development: {
    comms_domain: 'http://localhost:3000',
    auth_domain: 'http://localhost:3000',
    my_domain: 'http://localhost:3000',
  },
  staging: {
    comms_domain: 'http://localhost:3000',
    auth_domain: 'http://localhost:3000',
    my_domain: 'http://localhost:3000',
  },
  production: {
    comms_domain: 'http://localhost:3000',
    auth_domain: 'http://localhost:3000',
    my_domain: 'http://localhost:3000',
  },
}

export const ENV = process.env.ENVIRONMENT || 'development'
