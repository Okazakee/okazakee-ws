import { PostTag } from "@/types/fetchedData.types"
import { Tag } from "lucide-react"

export const PostTags = ({ tags }: { tags: PostTag[] }) => {
  return (
    <div className="flex flex-wrap my-4 md:gap-2 gap-1">
      { tags.map((tag, i) => (
        <span key={i} className="bg-secondary text-lighttext text-md gap-2 md:px-2 px-2 py-1 rounded-lg flex items-center">
          <Tag size={15} className='' />
          {tag.tag}
        </span>
      ))}
    </div>
  )
}