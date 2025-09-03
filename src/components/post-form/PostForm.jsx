import React, { useCallback } from "react";
import { useForm } from "react-hook-form";
import { Button, Input, RTE, Select } from "..";
import appwriteService from "../../appwrite/config";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

export default function PostForm({ post }) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    getValues,
    formState: { errors, isValid },
  } = useForm({
    defaultValues: {
      title: post?.title || "",
      slug: post?.slug || "",
      content: post?.content || "",
      status: post?.status || "active",
    },
  });

  const navigate = useNavigate();
  const userData = useSelector((state) => state.auth.userData);

  const submit = async (data) => {
    try {
      if (post) {
        const file = data.image?.[0] ? await appwriteService.uploadFile(data.image[0]) : null;

        if (file) {
          await appwriteService.deleteFile(post.featuredImage);
        }

        const dbPost = await appwriteService.updatePost(post.$id, {
          ...data,
          featuredImage: file ? file.$id : post.featuredImage,
        });

        if (dbPost) {
          navigate(`/post/${dbPost.$id}`);
        }
      } else {
        const file = data.image?.[0] ? await appwriteService.uploadFile(data.image[0]) : null;

        if (file) {
          data.featuredImage = file.$id;
        }

        const dbPost = await appwriteService.createPost({
          ...data,
          userId: userData.$id,
        });

        if (dbPost) {
          navigate(`/post/${dbPost.$id}`);
        }
      }
    } catch (error) {
      console.error("❌ PostForm submit error:", error);
      alert("Error submitting post: " + error.message);
    }
  };

  const slugTransform = useCallback((value) => {
    if (value && typeof value === "string")
      return value
        .trim()
        .toLowerCase()
        .replace(/[^a-zA-Z\d\s]+/g, "-")
        .replace(/\s/g, "-");

    return "";
  }, []);

  React.useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === "title") {
        setValue("slug", slugTransform(value.title), { shouldValidate: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, slugTransform, setValue]);

  return (
    <form onSubmit={handleSubmit(submit)} className="w-full">
      <div className="w-full px-2">
        <Input
          label="Title :"
          placeholder="Title"
          className="mb-4 w-full"
          {...register("title", { required: "Title is required" })}
        />
        {errors.title && <p className="text-red-500 mb-4">{errors.title.message}</p>}
        <Input
          label="Slug :"
          placeholder="Slug"
          className="mb-4 w-full"
          {...register("slug", { required: "Slug is required" })}
          onInput={(e) => {
            setValue("slug", slugTransform(e.currentTarget.value), { shouldValidate: true });
          }}
        />
        {errors.slug && <p className="text-red-500 mb-4">{errors.slug.message}</p>}
        <RTE label="Content :" name="content" control={control} defaultValue={getValues("content")} />
      </div>
      <div className="w-full px-2 mt-4">
        <Input
          label="Featured Image :"
          type="file"
          className="mb-4 w-full"
          accept="image/png, image/jpg, image/jpeg, image/gif"
          {...register("image", { required: !post && "Image is required for new posts" })}
        />
        {errors.image && <p className="text-red-500 mb-4">{errors.image.message}</p>}
        {post && (
          <div className="w-full mb-4">
            <img
              src={appwriteService.getFilePreview(post.featuredImage)?.href || appwriteService.getFilePreview(post.featuredImage)}
              alt={post.title}
              className="rounded-lg w-full"
            />
          </div>
        )}
        <Select
          options={["active", "inactive"]}
          label="Status"
          className="mb-4 w-full"
          {...register("status", { required: true })}
        />
        <Button type="submit" bgColor={post ? "bg-green-500" : undefined} className="w-full" disabled={!isValid}>
          {post ? "Update" : "Submit"}
        </Button>
      </div>
    </form>
  );
}