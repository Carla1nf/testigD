export const ShowWhenTrue = ({ when, children }: { when: boolean; children: React.ReactNode }) => {
  return when ? children : null
}

export const ShowWhenFalse = ({ when, children }: { when: boolean; children: React.ReactNode }) => {
  return !when ? children : null
}

export const HideWhenTrue = ({ when, children }: { when: boolean; children: React.ReactNode }) => {
  return when ? null : children
}

export const HideWhenFalse = ({ when, children }: { when: boolean; children: React.ReactNode }) => {
  return !when ? null : children
}
