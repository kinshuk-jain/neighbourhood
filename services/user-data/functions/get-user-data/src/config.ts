export const config: { [key: string]: any } = {
  development: {
    auth_domain: 'http://localhost:3000',
    my_domain: 'http://localhost:3000',
  },
  staging: {
    auth_domain: 'http://localhost:3000',
    my_domain: 'http://localhost:3000',
  },
  production: {
    auth_domain: 'http://localhost:3000',
    my_domain: 'http://localhost:3000',
  },
}

export const ENV = process.env.ENVIRONMENT || 'development'
