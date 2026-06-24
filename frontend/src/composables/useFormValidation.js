import { reactive } from 'vue'

export function useFormValidation(form, rules) {
  const errors = reactive({})

  function validateField(field) {
    const fieldRules = rules[field]
    if (!fieldRules) return true
    for (const rule of fieldRules) {
      const result = rule(form[field])
      if (result) {
        errors[field] = result
        return false
      }
    }
    errors[field] = ''
    return true
  }

  function validate() {
    let valid = true
    for (const field of Object.keys(rules)) {
      if (!validateField(field)) valid = false
    }
    return valid
  }

  function clearErrors() {
    for (const field of Object.keys(rules)) {
      errors[field] = ''
    }
  }

  return { errors, validate, validateField, clearErrors }
}
