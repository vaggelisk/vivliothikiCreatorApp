import axios from "axios";
import { useQuery } from "@tanstack/react-query";

export const QUERY_MY_POSTS = "QUERY_MY_POSTS";

export interface PostDto {
    id: string;
    title: string;
    description: string;
    content: string;
    created_at?: string;
}

export interface Post {
    id: string;
    title: string;
    description: string;
    content: string;
    createdAt?: Date;
}

const axiosInstance = axios.create({
    baseURL: 'http://localhost:4000',
});

const queryPostList: () => Promise<Post[]> = async () => {
    const response = await axiosInstance.get<{
        data: PostDto[];
    }>("/create-book");
    return response.data?.data?.map((postDto) => ({
        ...postDto,
        createdAt: postDto?.created_at ? new Date(postDto?.created_at) : undefined,
    }));
};

const useQueryPostList = (initialData?: Post[]) => {
    return useQuery([QUERY_MY_POSTS], queryPostList,
        { initialData });
};

export default useQueryPostList;
