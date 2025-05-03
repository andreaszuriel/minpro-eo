import { z } from 'zod';

// Password regex patterns
const containsNumber = /\d/;
const containsSpecialChar = /[!@#$%^&*(),.?":{}|<>]/;

// --- reusable password schema  ---
export const passwordValidation = z.string()
  .min(8, "Password must be at least 8 characters")
  .max(32, "Password must be less than 32 characters")
  .regex(containsNumber, "Password must contain at least one number")
  .regex(containsSpecialChar, "Password must contain at least one special character");
// ---

/**
 * Common validation schemas  */
export const schemas = {
  // Base user schema for common user data
  user: {
    name: z.string().min(1, "Name is required"),
    email: z.string().min(1, "Email is required").email("Invalid email"),
    // Use the exported password validation
    password: passwordValidation,
    role: z.enum(['customer', 'organizer'])
  },

  // User ID parameter
  userId: z.object({
    id: z.string().nonempty("User ID is required")
  }),

  // Authentication schemas
  auth: {
    // Sign in schema
    signIn: z.object({
      email: z.string().min(1, "Email is required").email("Invalid email"),
      password: z.string() 
        .min(1, "Password is required")
    }),

    // Sign up / registration schema
    signUp: z.object({
      name: z.string().min(1, "Name is required"),
      email: z.string().min(1, "Email is required").email("Invalid email"),
      // Use the exported password validation
      password: passwordValidation,
      role: z.enum(['customer', 'organizer']).default('customer')
    }),

    // Password reset schema (without token - for general use)
    resetPassword: z.object({
      // Use the exported password validation
      password: passwordValidation,
      // Confirm password just needs to exist, the refine checks the match
      confirmPassword: z.string()
        .min(1, "Password confirmation is required")
    }).refine(data => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"]
    }) //
  }
};

// Exported convenience objects
export const userSchema = { 
  body: z.object({
    name: schemas.user.name,
    email: schemas.user.email,
    password: schemas.user.password,
    role: schemas.user.role,
  }),
  params: schemas.userId,
};

export const signInSchema = schemas.auth.signIn;
export const signUpSchema = schemas.auth.signUp;
export const resetPasswordSchema = schemas.auth.resetPassword;