import axios from "./axios";

export interface SignedUploadParams {
  courseId: string;
  filename: string;
  contentType?: string;
}

export interface SignedUploadResp {
  path: string;
  token: string;
  expiresIn: number;
  bucket: string;
}

const uploadApi = {
  createSupabaseSignedUpload: (params: SignedUploadParams): Promise<SignedUploadResp> =>
    axios.post(`/uploads/supabase/signed-upload`, params),
};

export default uploadApi;

