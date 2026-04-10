import { IManufacturerDrawerItem } from '@/libs/collection/collection';
import { StatusOption, TypeOption } from '../collectionForm.helpers';
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
  setManufacturerId: (value: number) => void;
  setReleaseTypeId: (value: number) => void;
  setSeriesId: (value: number) => void;
  setStatusId: (value: 0 | 1 | 2 | 3) => void;
  statusId: 0 | 1 | 2 | 3 | null;
  typeOptions: TypeOption[];
  gradeId: number | null;
  isManufacturerDrawerOpen: boolean;
  isReleaseTypeDrawerOpen: boolean;
  isSeriesDrawerOpen: boolean;
  isStatusDrawerOpen: boolean;
  isTypeDrawerOpen: boolean;
  getTypeLabel: (type: TypeOption) => string;
  statusOptions: StatusOption[];
  onSelectAddonManufacturer: (manufacturer: IManufacturerDrawerItem) => void;
};

const FormSelectDrawers = ({
  activeAddonManufacturerId,
  activeAddonManufacturerIndex,
  getTypeLabel,
  gradeId,
  isManufacturerDrawerOpen,
  isReleaseTypeDrawerOpen,
  isSeriesDrawerOpen,
  isStatusDrawerOpen,
  isTypeDrawerOpen,
  manufacturerId,
  manufacturers,
  onSelectAddonManufacturer,
  releaseTypeId,
  releaseTypes,
  seriesId,
  seriesOptions,
  setActiveAddonManufacturerIndex,
  setGradeId,
  setIsManufacturerDrawerOpen,
  setIsReleaseTypeDrawerOpen,
  setIsSeriesDrawerOpen,
  setIsStatusDrawerOpen,
  setIsTypeDrawerOpen,
  setManufacturerId,
  setReleaseTypeId,
  setSeriesId,
  setStatusId,
  statusId,
  statusOptions,
  typeOptions,
}: FormSelectDrawersProps) => {
  return (
    <>
      <FormSelectDrawer
        open={isTypeDrawerOpen}
        onOpenChange={setIsTypeDrawerOpen}
        title="Select Collection Type"
        options={typeOptions.map((option) => ({
          key: `${option.grade_id}-${option.collection_type_name}-${option.scale}`,
          label: getTypeLabel(option),
          isSelected: option.grade_id === gradeId,
          onSelect: () => {
            setGradeId(option.grade_id);
            setIsTypeDrawerOpen(false);
          },
        }))}
        emptyText="No collection types available."
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
