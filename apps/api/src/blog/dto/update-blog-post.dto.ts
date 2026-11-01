import { PartialType } from '../../common/partial-type';
import { Equals, IsOptional } from 'class-validator';
import { CreateBlogPostDto } from './create-blog-post.dto';

export class UpdateBlogPostDto extends PartialType(CreateBlogPostDto) {
  @IsOptional()
  @Equals(null)
  coverImage?: null;
}
