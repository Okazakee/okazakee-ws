import { PostTag } from "@/types/fetchedData.types"
import { Tag } from "lucide-react"

export const PostTags = ({ tags }: { tags: PostTag[] }) => {
  return (
    <div className="flex flex-wrap my-4 md:gap-2 gap-1">
      { tags.map((tag, i) => (
        <span key={i} className="bg-secondary text-lighttext text-base gap-2 md:px-2 px-2 xs:py-1 sm:py-1 rounded-lg flex items-center">
          <Tag size={15} className='' />
          <h5 className="mt-0.5 md:mt-0">{tag.tag}</h5>
        </span>
      ))}
    </div>
  )
}