// Organized Imports
import DashboardLayout from "@/layouts/DashboardLayout";
import { QuestionDocument } from "@/models/question";
import QuestionService from "@/services/QuestionService";
import { Button, Input, Stack } from "@mui/material";
import { DataGrid, GridColDef, GridEventListener, GridPaginationModel } from "@mui/x-data-grid";
import { GetServerSideProps, NextPage } from "next";
import Link from "next/link";
import { useRouter } from 'next/router';
import { useState } from "react";

interface QuestionsPageProps {
    questions: QuestionDocument[];
    total: number;
}

const columns: GridColDef[] = [
    // Simplified column definitions
    { field: 'id', headerName: 'ID', width: 300 },
    { field: 'text', headerName: 'Text', flex: 1 },
    { field: 'difficulty', headerName: 'Difficulty', width: 150 },
    { field: 'skillId', headerName: 'Skill', width: 150 },
];

const QuestionsPage: NextPage<QuestionsPageProps> = ({ questions,total }) => {
    const router = useRouter();
    const [selectedRow, setSelectedRow] = useState<string[]>([]);


    const page = +(router.query.page as string) || 0;

    const pageSize = +(router.query.pageSize as string) || 10;



    const cellClickHandler:GridEventListener<"cellClick"> = (params) => {
        const routeMap = { id: 'questions', skillId: 'skills' } as any;
        const route = routeMap[params.colDef.field];
        if (route) {
            router.push(`/dashboard/${route}/${params.row[params.colDef.field]}`);
        }
    };

    const handleDelete = async () => {
        console.log(selectedRow)
        await Promise.all(selectedRow.map(id => QuestionService.instance.delete(id)))
        location.reload()
    }

    const handlePaginationModelChange = (model:GridPaginationModel) => {
        if(model.page == page  && model.pageSize == pageSize)
            return

        console.log(model,4)
    
        router.push("/dashboard/questions",{
            query: {
     
                page: model.page,
                pageSize: model.pageSize
            }
        })
    }

    return (
        <DashboardLayout title="Questions">
            <Stack spacing={2} padding={theme => theme.spacing(2)}>
                <Stack direction="row" alignItems="center" spacing={2} justifyContent="space-between">
                    <Input placeholder="Search" sx={{flex:1,maxWidth:400}} />
                    <Stack direction="row" spacing={1}>
                        {selectedRow.length > 0 && <Button onClick={handleDelete} color="error">
                            Delete
                        </Button>}
                    <Button size="large" component={Link} href="/dashboard/questions/create">
                        Create
                    </Button>
                    </Stack>
      
                </Stack>
                <DataGrid
                    rows={questions}
                    columns={columns}
                    pagination
                    paginationModel={{
                        page,
                        pageSize
                    }}
                    rowCount={total}
                    
                
                    pageSizeOptions={[5,10]}
                    checkboxSelection
                    onRowSelectionModelChange={(rowSelectionModel) => setSelectedRow(rowSelectionModel as string[])}
                    onCellClick={cellClickHandler}
                    paginationMode="server"
                    getRowId={(row) => row.id}
                    
                    onPaginationModelChange={handlePaginationModelChange}
                />
            </Stack>
        </DashboardLayout>
    );
};

export const getServerSideProps:GetServerSideProps = async (p) => {
    try {
        const { page = "0", pageSize = "10" } = p.query;
        const pageNum = parseInt(page as string, 10);
        const pageSizeNum = parseInt(pageSize as string, 10);
        const result = await QuestionService.instance.getAll({
            page: pageNum,
            pageSize: pageSizeNum
        });
        return { props: { questions:result.data, total: result.total } };
    } catch (error) {
        // Handle the error appropriately
        return { props: { questions: [] } };
    }
};

export default QuestionsPage;
