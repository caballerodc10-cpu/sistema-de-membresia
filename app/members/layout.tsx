// Layout raíz del módulo /members/ — sin auth, solo wrapper semántico
// El auth real está en app/members/(protected)/layout.tsx
export default function MembersRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
