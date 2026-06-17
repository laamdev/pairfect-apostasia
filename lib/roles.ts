/** Roles de empleado dentro de un restaurante y sus etiquetas en español. */
export type MembershipRole = 'owner' | 'staff';

/** Etiqueta legible (español) para un rol de empleado. */
export const roleLabel = (role: MembershipRole | string): string => {
  switch (role) {
    case 'owner':
      return 'Administrador';
    case 'staff':
      return 'Empleado';
    default:
      return role;
  }
};
