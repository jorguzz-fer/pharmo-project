interface StatusBadgeProps {
    status: string;
    type?: 'clinic' | 'vet' | 'prescription';
}

export function StatusBadge({ status, type = 'clinic' }: StatusBadgeProps) {
    const getStatusConfig = () => {
        if (type === 'clinic') {
            switch (status) {
                case 'PENDENTE':
                    return { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' };
                case 'EM_ANALISE':
                    return { label: 'Em Análise', color: 'bg-blue-100 text-blue-800' };
                case 'APROVADA':
                    return { label: 'Aprovada', color: 'bg-green-100 text-green-800' };
                case 'SUSPENSA':
                    return { label: 'Suspensa', color: 'bg-red-100 text-red-800' };
                case 'INATIVA':
                    return { label: 'Inativa', color: 'bg-gray-100 text-gray-800' };
                default:
                    return { label: status, color: 'bg-gray-100 text-gray-800' };
            }
        } else if (type === 'vet') {
            switch (status) {
                case 'ACTIVE':
                    return { label: 'Ativo', color: 'bg-green-100 text-green-800' };
                case 'INACTIVE':
                    return { label: 'Inativo', color: 'bg-gray-100 text-gray-800' };
                case 'PENDING':
                    return { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' };
                default:
                    return { label: status, color: 'bg-gray-100 text-gray-800' };
            }
        }
        return { label: status, color: 'bg-gray-100 text-gray-800' };
    };

    const config = getStatusConfig();

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
            {config.label}
        </span>
    );
}
