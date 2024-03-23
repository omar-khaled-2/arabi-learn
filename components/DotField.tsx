interface DotFieldProps {
    placeholder: string;
}

const DotField:React.FC<DotFieldProps> = ({placeholder}) => {
    return <canvas width={200} height={200} style={{backgroundImage: `url(${placeholder})`}}>

    </canvas>
}


export default DotField