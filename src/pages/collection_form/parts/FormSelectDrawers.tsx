import {
  IFiguresScaleFilterItem,
  IGradeDrawerItem,
  IManufacturerDrawerItem,
} from '@/libs/collection/collection';
import { StatusOption } from '../helpers/collectionForm.helpers';
import FormSelectDrawer from './FormSelectDrawer';

type FormSelectDrawersProps = {
  activeAddonManufacturerId?: number;
  activeAddonManufacturerIndex: number | null;
  manufacturerId: number | null;
  manufacturers: IManufacturerDrawerItem[];
  releaseTypeId: number | null;
  releaseTypes: { id: number; name: string }[];
  seriesId: number | null;
  seriesOptions: { id: number; name: string }[];
  setActiveAddonManufacturerIndex: (value: number | null) => void;
  setGradeId: (value: number) => void;
  setIsManufacturerDrawerOpen: (value: boolean) => void;
  setIsReleaseTypeDrawerOpen: (value: boolean) => void;
  setIsSeriesDrawerOpen: (value: boolean) => void;
  setIsStatusDrawerOpen: (value: boolean) => void;
  setIsTypeDrawerOpen: (value: boolean) => void;
  setIsGradeDrawerOpen: (value: boolean) => void;
  setIsScaleDrawerOpen: (value: boolean) => void;
  setIsDisplaySizeDrawerOpen: (value: boolean) => void;
  setManufacturerId: (value: number) => void;
  setReleaseTypeId: (value: number) => void;
  setSeriesId: (value: number) => void;
  setStatusId: (value: 0 | 1 | 2 | 3) => void;
  setScaleId: (value: number) => void;
  setDisplaySize: (value: string) => void;
  statusId: 0 | 1 | 2 | 3 | null;
  gradeId: number | null;
  scaleId: number | null;
  displaySize: string | null;
  isManufacturerDrawerOpen: boolean;
  isReleaseTypeDrawerOpen: boolean;
  isSeriesDrawerOpen: boolean;
  isStatusDrawerOpen: boolean;
  isTypeDrawerOpen: boolean;
  isGradeDrawerOpen: boolean;
  isScaleDrawerOpen: boolean;
  isDisplaySizeDrawerOpen: boolean
  statusOptions: StatusOption[];
  onSelectAddonManufacturer: (manufacturer: IManufacturerDrawerItem) => void;
  collectionType: string | null;
  collectionTypes: string[];
  gunplaGrades: IGradeDrawerItem[];
  scales: IFiguresScaleFilterItem[];
  handleSelectCollectionType: (type: string) => void;
  drawerDisplaySizes: string[];
};

const FormSelectDrawers = ({
  activeAddonManufacturerId,
  activeAddonManufacturerIndex,
  gradeId,
  isManufacturerDrawerOpen,
  isReleaseTypeDrawerOpen,
  isSeriesDrawerOpen,
  isStatusDrawerOpen,
  isTypeDrawerOpen,
  isGradeDrawerOpen,
  isScaleDrawerOpen,
  isDisplaySizeDrawerOpen,
  manufacturerId,
  manufacturers,
  onSelectAddonManufacturer,
  releaseTypeId,
  releaseTypes,
  seriesId,
  displaySize,
  seriesOptions,
  setActiveAddonManufacturerIndex,
  setGradeId,
  setIsManufacturerDrawerOpen,
  setIsReleaseTypeDrawerOpen,
  setIsSeriesDrawerOpen,
  setIsStatusDrawerOpen,
  setIsTypeDrawerOpen,
  setIsGradeDrawerOpen,
  setIsScaleDrawerOpen,
  setIsDisplaySizeDrawerOpen,
  setManufacturerId,
  setReleaseTypeId,
  setSeriesId,
  setStatusId,
  setScaleId,
  setDisplaySize,
  statusId,
  statusOptions,
  collectionType,
  collectionTypes,
  gunplaGrades,
  scales,
  handleSelectCollectionType,
  scaleId,
  drawerDisplaySizes,
}: FormSelectDrawersProps) => {
  return (
    <>
      <FormSelectDrawer
        open={isTypeDrawerOpen}
        onOpenChange={setIsTypeDrawerOpen}
        title="Select Collection Type"
        options={collectionTypes.map((type) => ({
          key: type,
          label: type,
          isSelected: type === collectionType,
          onSelect: () => {
            handleSelectCollectionType(type);
          },
        }))}
        emptyText="No collection types available."
      />

      <FormSelectDrawer
        open={isGradeDrawerOpen}
        onOpenChange={setIsGradeDrawerOpen}
        title="Select Grade"
        options={gunplaGrades.map((grade) => ({
          key: grade.grade_id,
          label: grade.grade_short_name,
          isSelected: grade.grade_id === gradeId,
          onSelect: () => {
            setGradeId(grade.grade_id);
            setIsGradeDrawerOpen(false);
          },
        }))}
        emptyText="No grades available."
      />

      <FormSelectDrawer
        open={isScaleDrawerOpen}
        onOpenChange={setIsScaleDrawerOpen}
        title="Select Scale"
        options={scales.map((scale) => ({
          key: scale.id,
          label: scale.name,
          isSelected: scale.id === scaleId,
          onSelect: () => {
            setScaleId(scale.id);
            setIsScaleDrawerOpen(false);
          },
        }))}
        emptyText="No scales available."
      />

      <FormSelectDrawer
        open={isStatusDrawerOpen}
        onOpenChange={setIsStatusDrawerOpen}
        title="Select Status"
        options={statusOptions.map((option) => ({
          key: option.id,
          label: option.name,
          isSelected: option.id === statusId,
          onSelect: () => {
            setStatusId(option.id);
            setIsStatusDrawerOpen(false);
          },
        }))}
      />

      <FormSelectDrawer
        open={isReleaseTypeDrawerOpen}
        onOpenChange={setIsReleaseTypeDrawerOpen}
        title="Select Release Type"
        options={releaseTypes.map((option) => ({
          key: option.id,
          label: option.name,
          isSelected: option.id === releaseTypeId,
          onSelect: () => {
            setReleaseTypeId(option.id);
            setIsReleaseTypeDrawerOpen(false);
          },
        }))}
        emptyText="No release types available."
      />

      <FormSelectDrawer
        open={isSeriesDrawerOpen}
        onOpenChange={setIsSeriesDrawerOpen}
        title="Select Series"
        options={seriesOptions.map((option) => ({
          key: option.id,
          label: option.name,
          isSelected: option.id === seriesId,
          onSelect: () => {
            setSeriesId(option.id);
            setIsSeriesDrawerOpen(false);
          },
        }))}
        emptyText="No series available."
      />

      <FormSelectDrawer
        open={isManufacturerDrawerOpen}
        onOpenChange={setIsManufacturerDrawerOpen}
        title="Select Manufacturer"
        options={manufacturers.map((option: IManufacturerDrawerItem) => ({
          key: option.id,
          label: option.name,
          isSelected: option.id === manufacturerId,
          onSelect: () => {
            setManufacturerId(option.id);
            setIsManufacturerDrawerOpen(false);
          },
        }))}
        emptyText="No manufacturers available."
      />

      <FormSelectDrawer
        open={isDisplaySizeDrawerOpen}
        onOpenChange={setIsDisplaySizeDrawerOpen}
        title="Select Display Size"
        options={drawerDisplaySizes.map((size) => ({
          key: size,
          label: size,
          isSelected: size === displaySize,
          onSelect: () => {
            setDisplaySize(size);
            setIsDisplaySizeDrawerOpen(false);
          },
        }))}
        emptyText="No display sizes available."
      />

      <FormSelectDrawer
        open={activeAddonManufacturerIndex !== null}
        onOpenChange={(open) => {
          if (!open) setActiveAddonManufacturerIndex(null);
        }}
        title="Select Addon Manufacturer"
        options={manufacturers.map((option: IManufacturerDrawerItem) => ({
          key: option.id,
          label: option.name,
          isSelected: option.id === activeAddonManufacturerId,
          onSelect: () => {
            onSelectAddonManufacturer(option);
          },
        }))}
        emptyText="No manufacturers available."
      />
    </>
  );
};

export default FormSelectDrawers;
