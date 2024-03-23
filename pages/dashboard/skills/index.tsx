import DashboardLayout from "@/layouts/DashboardLayout";
import { Skill } from "@/models/skill";
import SkillService from "@/services/SkillService";
import { Button, Stack } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import Link from "next/link";
import { useRouter } from "next/navigation";


interface SkillsPageProps {
    skills: Skill[]
}

// class Action

const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 300,sortable: false,},
    {
      field: 'name',
      editable: true,
      flex: 1
    },
    {
      field: 'maxDifficulty',
      headerName: 'Max Difficulty',
      width: 150,
      editable: false,
    },
  ];

const SkillsPage:React.FC<SkillsPageProps> = ({skills}) => {
    const router = useRouter()
    return <DashboardLayout title="Skills">
        <Stack spacing={2} padding={theme => theme.spacing(2)}>
            <Stack direction="row" justifyContent="space-between">
                <div></div>
                <Button size="large" component={Link} href="/dashboard/skills/create">
                    Create
                </Button>
            </Stack>
        <DataGrid
          rows={skills}
          columns={columns}  
          pageSizeOptions={[5]}
          checkboxSelection
          disableRowSelectionOnClick
          onCellClick={(params) => params.colDef.field == "id" && router.push(`/dashboard/skills/${params.row.id}`)}
        paginationMode="server"
        hideFooter
          getRowId={(row) => row.id}
        />
        </Stack>

    </DashboardLayout>
}



export const getServerSideProps = async() => {
    const skills = await SkillService.instance.getAll();
    
    console.log(skills)
    return {
        props: {
            skills
        }
    }
}


export default SkillsPage