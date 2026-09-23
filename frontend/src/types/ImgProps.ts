export interface ImgProps {
    src: string;
    alt: string;
    height: string;
    isUpdate?: boolean;
    onFileChange?: (file: File | null, deleteFile?: boolean) => void;
}