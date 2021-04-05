export const config: { [key: string]: any } = {
  staging: {
    comms_domain: 'http://localhost:3000',
    user_domain: 'http://localhost:3000',
    redirect_link: '',
  },
  development: {
    comms_domain: 'http://localhost:3000',
    user_domain: 'http://localhost:3000',
    redirect_link: 'http://localhost:3000/auth/oauth/redirect',
  },
  production: {
    comms_domain: 'http://localhost:3000',
    user_domain: 'http://localhost:3000',
    redirect_link: '',
  },
}

export const ENV = process.env.ENVIRONMENT || 'development'
