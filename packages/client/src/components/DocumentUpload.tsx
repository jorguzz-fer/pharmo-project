import { useState, useRef } from 'react';
import { Upload, X, FileText, Image as ImageIcon } from 'lucide-react';

interface DocumentUploadProps {
    onUpload: (file: File, tipo: string) => Promise<void>;
    acceptedTypes?: string;
    maxSizeMB?: number;
    tipoDocumento: string;
    label: string;
}

export function DocumentUpload({
    onUpload,
    acceptedTypes = '.pdf,.png,.jpg,.jpeg',
    maxSizeMB = 10,
    tipoDocumento,
    label
}: DocumentUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const validateFile = (file: File): string | null => {
        const maxSize = maxSizeMB * 1024 * 1024;
        if (file.size > maxSize) {
            return `Arquivo muito grande. Máximo: ${maxSizeMB}MB`;
        }

        const extension = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!acceptedTypes.includes(extension)) {
            return `Tipo de arquivo não aceito. Aceitos: ${acceptedTypes}`;
        }

        return null;
    };

    const handleFile = async (file: File) => {
        setError(null);

        const validationError = validateFile(file);
        if (validationError) {
            setError(validationError);
            return;
        }

        setUploading(true);
        try {
            await onUpload(file, tipoDocumento);
        } catch (err: any) {
            setError(err.message || 'Erro ao fazer upload');
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFile(files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFile(files[0]);
        }
    };

    const getFileIcon = () => {
        if (acceptedTypes.includes('.pdf')) {
            return <FileText className="w-8 h-8 text-gray-400" />;
        }
        return <ImageIcon className="w-8 h-8 text-gray-400" />;
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
                {label}
            </label>

            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                    relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                    transition-colors duration-200
                    ${isDragging ? 'border-teal-500 bg-teal-50' : 'border-gray-300 hover:border-gray-400'}
                    ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={acceptedTypes}
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={uploading}
                />

                <div className="flex flex-col items-center space-y-2">
                    {uploading ? (
                        <>
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                            <p className="text-sm text-gray-600">Enviando...</p>
                        </>
                    ) : (
                        <>
                            {getFileIcon()}
                            <div className="flex items-center space-x-1">
                                <Upload className="w-4 h-4 text-teal-600" />
                                <span className="text-sm text-teal-600 font-medium">
                                    Clique ou arraste o arquivo
                                </span>
                            </div>
                            <p className="text-xs text-gray-500">
                                {acceptedTypes.replace(/\./g, '').toUpperCase()} até {maxSizeMB}MB
                            </p>
                        </>
                    )}
                </div>
            </div>

            {error && (
                <div className="flex items-center space-x-2 text-red-600 text-sm">
                    <X className="w-4 h-4" />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
}
