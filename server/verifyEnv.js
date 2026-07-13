const requiredKeys = [
  'SUPABASE_URL',
  'SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_SECRET_KEY',
  'SUPABASE_JWKS_URL',
]

const missingKeys = requiredKeys.filter((key) => !process.env[key])

if (missingKeys.length) {
  console.error(`Missing backend environment variables: ${missingKeys.join(', ')}`)
  process.exitCode = 1
} else {
  console.log('Supabase backend environment variables are available.')
}
