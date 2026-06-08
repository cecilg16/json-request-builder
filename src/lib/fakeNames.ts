const firstNames = [
  'Ava', 'Liam', 'Noah', 'Emma', 'Olivia', 'Sophia', 'Elijah', 'Mason', 'Lucas', 'Mia',
]

const lastNames = [
  'Lee', 'Nguyen', 'Garcia', 'Patel', 'Kim', 'Brown', 'Johnson', 'Davis', 'Wilson', 'Miller',
]

export function generateFakeName() {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]

  return {
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
  }
}

export function generateUniqueNames(count: number) {
  const used = new Set<string>()
  const result = [] as Array<{ firstName: string; lastName: string }>

  while (result.length < count) {
    const candidate = generateFakeName()
    const key = `${candidate.firstName}-${candidate.lastName}`
    if (!used.has(key)) {
      used.add(key)
      result.push(candidate)
    }
  }

  return result
}
