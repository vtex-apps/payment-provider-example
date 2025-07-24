export interface CreatePaymentIntentsPayload {
    amount: number;
    currency: string;
    automatic_payment_methods?: {
        enabled: boolean;
    };
    capture_method?: CaptureMethodEnum;
    transfer_group?: string;
}

export enum CaptureMethodEnum {
    AUTOMATIC = 'automatic',
    MANUAL = 'manual',
}