export enum ErrorCode {
    UNKNOWN_ERROR,
    TOKEN_IS_INVALID,
    UPDATE_ZERO_FIELD,
    TOO_MANY_REQUEST,
    OTP_INVALID_OR_EXPIRED,
    FILE_NOT_EXIST,
    DUPLICATE_REQUEST,
    UPDATE_ZERO_ROW,
    PERMISSION_DENIED,
    MISSION_IN_PROGRESS,

    // User
    USER_INVALID = 1000,
    USERNAME_EXIST,
    ADDRESS_EXISTS,
    USER_EMAIL_VERIFIED,
    EMAIL_EXISTS,
    PASSWORD_IS_INVALID,
    USER_NOT_FOUND,
    ADDRESS_INVALID,
    EMAIL_ACTIVATED,
    EMAIL_EXIST,
    MOBILE_EXIST,
    UPLOAD_S3_FAILED,

    //config
    CONFIG_NOT_FOUND = 2000,

    //auth
    WRONG_PASSWORD = 3000,
    OTP_NOT_VERIFIED= 3001,
    OTP_NOT_FOUND = 3002,
    OTP_EXPIRED = 3003,
    OTP_TOO_MANY_ATTEMPTS = 3004,
    OTP_INVALID_CODE = 3005,
}

export enum HttpStatus {
    OK = 200,
    CREATED = 201,
    ACCEPTED = 202,
    NO_CONTENT = 204,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    PAYMENT_REQUIRE = 402,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    METHOD_NOT_ALLOWED = 405,
    NOT_ACCEPTABLE = 406,
    REQUEST_TIMEOUT = 408,
    UNPROCESSABLE_ENTITY = 422,
    TOO_MANY_REQUEST = 429,
    INTERNAL_SERVER_ERROR = 500,
    NOT_IMPLEMENTED = 501,
    SERVICE_UNAVAILABLE = 503,
}

export enum ActiveStatus {
    ACTIVATED = 1,
    UNACTIVATED = 2,
}

export enum TokenType {
    LOGIN = 1,
    ACTIVE_USER,
    RESET_PASSWORD,
}

export enum OtpType {
    VERIFY_EMAIL = 1,
    FORGOT_PASSWORD,
    VERIFY_WITHDRAWAL,
}

export enum OtpWay {
    EMAIL = 1,
    // MOBILE,
}

export enum UserStatus {
    ACTIVATED = 1,
    DEACTIVATED,
    BANNED,
    PENDING,
}


export enum ConfigKey {

}

export enum KEY_CACHE {
    LIMIT_OFFSET_ORDER = "LIMIT_OFFSET_ORDER_",
    LIST = "LIST",
    ID = "ID_",
    TYPE = "TYPE_",
    USER_ID = "USER_ID_",
    MISSION_ID = "MISSION_ID_",
    POINT_REWARD='POINT_REWARD',
    LEVEL='LEVEL',
    TIER='TIER',
}

export enum COLLECTION_CACHE {
    SYSTEM_CONFIG = "configs",
    CURRENCY_DETAl = "currencies",
    USER_INFO = "user_info",
    USER_REF_BY_USER_ID = "user_referral",
    USER_PERMISSION = "user_permission",
    RESOURCE_DETAL = "resources",
    MISSION = 'MISSION',
    MISSION_CHECK = 'MISSION_CHECK',
    LIST_ITEMS = 'LIST_ITEMS',
    REWARD_CONFIG='REWARD_CONFIG',
    PIECE_WEAPON = 'PIECE_WEAPON',
    LIST_WEAPONS_BY_TIER='LIST_WEAPONS_BY_TIER'
}

export enum Permission {
    READ = 1 << 0,         // 0000001 = 1
    WRITE = 1 << 1,        // 0000010 = 2
    UPDATE = 1 << 2,      // 0000100 = 4
    DELETE = 1 << 3,       // 0001000 = 8
}

export enum PermissionResourceType {
    USER = 'USER',
    WITHDRAWAL = 'WITHDRAWAL',
}

export enum AuthStatus {
    CONFIRMED=1,
    PENDING =2,
    CANCELLED=3
}

export enum Constant {

}

