import { gql } from '@apollo/client';

export const UPLOAD_MINT = gql`
  mutation UploadMint($input: UploadMintInput!) {
    uploadMint(input: $input) {
      success
      message
      entryId
      txHash
    }
  }
`;

