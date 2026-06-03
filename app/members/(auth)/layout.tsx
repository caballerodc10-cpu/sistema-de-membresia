// Layout vacío — bypasea el layout protegido del módulo /members/
// Las páginas en este grupo (login) no necesitan auth
export default function MembersAuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
